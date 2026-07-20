using System;

namespace NatureMiniPlex.Core.Domain.Common;

public static class SequentialGuidGenerator
{
    public static Guid Create()
    {
        // .NET 8 compatible approach for SQL Server Sequential GUID
        byte[] guidArray = Guid.NewGuid().ToByteArray();

        DateTime baseDate = new DateTime(1900, 1, 1);
        DateTime now = DateTime.UtcNow;
        
        TimeSpan days = new TimeSpan(now.Ticks - baseDate.Ticks);
        TimeSpan msecs = now.TimeOfDay;

        byte[] daysArray = BitConverter.GetBytes(days.Days);
        byte[] msecsArray = BitConverter.GetBytes((long)(msecs.TotalMilliseconds / 3.333333));

        Array.Reverse(daysArray);
        Array.Reverse(msecsArray);

        // Copy bytes into guid (optimized for SQL Server sorting which checks bytes 10-15 first)
        Array.Copy(daysArray, daysArray.Length - 2, guidArray, guidArray.Length - 6, 2);
        Array.Copy(msecsArray, msecsArray.Length - 4, guidArray, guidArray.Length - 4, 4);

        return new Guid(guidArray);
    }
}
